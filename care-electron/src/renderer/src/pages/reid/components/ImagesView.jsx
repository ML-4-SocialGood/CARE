/* eslint-disable */
import { useEffect, useState, useRef, useMemo } from 'react'
import ReactPaginate from 'react-paginate'
import closeIcon from '../../../assets/close.png'
import { Button } from '../../../components/Button'
import { Heading } from '../../../components/Heading'
import ReIDTreeItem from '../../../components/ReIDTreeItem'
import TreeView from '../../../components/TreeView.jsx'
import classNames from 'classnames'
import { createPortal } from 'react-dom'
import Modal from '../../../components/Modal.jsx'
import styles from './RenameModal.module.css'

export default function ImagesView({ detects: initialDetects }) {
  const [files, setFiles] = useState([]) // Store the files in the current folder
  const [detects, setDetects] = useState(initialDetects) // Store the folder tree
  const [currentFolder, setCurrentFolder] = useState('') // Store the current folder path
  const currentFiles = useMemo(
    () => files.filter((item) => item.parent === currentFolder),
    [files, currentFolder]
  )
  const [selected, setSelected] = useState(new Set()) // Store the selected file path
  const [preview, setPreview] = useState(null) // Store the current preview image
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameItemId, setRenameItemId] = useState(null)
  const [newID, setNewID] = useState('')
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(0)
  const pageCount = Math.ceil(files.length / itemsPerPage)

  const [inputPage, setInputPage] = useState('1')

  const currentItems = files.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const changePage = ({ selected }) => {
    setCurrentPage(selected)
    setInputPage((selected + 1).toString())
    handlePreview(files[selected * itemsPerPage], files)
  }

  useEffect(() => {
    if (!currentFolder) return

    const fetchFiles = async () => {
      setFiles([])

      const selectedFolder = detects.find((item) => item.path === currentFolder)

      if (!selectedFolder.group_id) return

      try {
        const response = await window.api.browseReidImage(
          selectedFolder.date,
          selectedFolder.time,
          selectedFolder.group_id
        )
        const files = response.files
          .filter((item) => !item.isDirectory)
          .map((item) => ({
            ...item,
            parent: selectedFolder.path,
            path: `${selectedFolder.date}/${item.path}`
          }))

        const uniqueFiles = []
        files.forEach((item) => {
          if (uniqueFiles.find((f) => f.name === item.name)) return
          uniqueFiles.push(item)
        })

        if (uniqueFiles.length != 0) {
          handlePreview(uniqueFiles[0], uniqueFiles)
        }

        setFiles(uniqueFiles)
      } catch (error) {
        console.error('Error fetching files:', error)
      }
    }

    fetchFiles()
  }, [currentFolder, detects])

  const handlePreview = async (file, files) => {
    const response = await window.api.viewDetectImage(file.realDate, file.realPath)
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    setPreview({
      path: file.path,
      name: file.name,
      src: URL.createObjectURL(blob),
      index: files.indexOf(file)
    })

    setPreview({
      path: file.path,
      name: file.name,
      src: URL.createObjectURL(blob),
      index: files.indexOf(file)
    })
  }

  const onDelete = (itemId) => {
    console.log('Delete button clicked, itemId:', itemId)
    setDeleteItemId(itemId)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async (itemId) => {
    console.log('handleConfirmDelete called, itemId:', itemId)
    const [date, time] = itemId.split('/')

    try {
      const response = await window.api.deleteReidResult(date, time)
      if (response.ok) {
        // Show a success notification modal after deletion
        setNotificationMessage(`Successfully deleted the record for date ${date} and time ${time}.`)
        setShowNotificationModal(true)

        // Update the file list by removing the deleted item
        setDetects((prevFiles) => {
          console.log('Before filter:', prevFiles)

          // Delete the item and its children
          const updatedFiles = prevFiles.filter((file) => {
            return !file.path.startsWith(itemId)
          })

          // Check if the parent path has other children
          const parentPath = itemId.substring(0, itemId.lastIndexOf('/'))
          const hasOtherChildren = updatedFiles.some((file) =>
            file.path.startsWith(`${parentPath}/`)
          )

          // Remove the parent path if it has no other children
          const finalFiles = hasOtherChildren
            ? updatedFiles
            : updatedFiles.filter((file) => file.path !== parentPath)

          console.log('After filter:', finalFiles)
          return finalFiles
        })

        setShowDeleteModal(false)
      } else {
        setNotificationMessage(`Failed to delete: ${response.error}`)
        setShowNotificationModal(true)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      setNotificationMessage('Failed to delete the file. Please try again.')
      setShowNotificationModal(true)
    }
  }

  const onRename = (itemId, currentName) => {
    console.log('Rename button clicked, itemId:', itemId)
    setRenameItemId(itemId)
    setNewID(currentName)
    setShowRenameModal(true)
  }

  const handleConfirmRename = async (itemId) => {
    console.log('handleConfirmRename called, itemId:', itemId)
    const [date, time, oldGroupId] = itemId.split('/')
    if (newID) {
      if (newID === oldGroupId) {
        setNotificationMessage(
          'The new name is the same as the old name. The group name will not change.'
        )
        setShowNotificationModal(true)
        return
      }
      try {
        const response = await window.api.renameReidGroup(date, time, oldGroupId, newID)
        if (response.ok) {
          console.log('Rename successful')
          setDetects((prevDetects) =>
            prevDetects.map((folder) =>
              folder.path === itemId
                ? { ...folder, name: newID, group_id: newID, path: `${date}/${time}/${newID}` }
                : folder
            )
          )
          fetchFiles(newID)
          setShowRenameModal(false)
          setNotificationMessage(`Successfully renamed from "${oldGroupId}" to "${newID}".`)
          setShowNotificationModal(true)
        } else {
          setNotificationMessage(response.message)
          setShowNotificationModal(true)
        }
      } catch (error) {
        console.error('Failed to rename group:', error)
        setNotificationMessage('Failed to rename the group. Please try again.')
        setShowNotificationModal(true)
      }
    }
  }

  const fetchFiles = async (currentGroupId) => {
    setFiles([])

    const selectedFolder = detects.find((item) => item.group_id === currentGroupId)

    if (!selectedFolder || !selectedFolder.group_id) return

    try {
      const response = await window.api.browseReidImage(
        selectedFolder.date,
        selectedFolder.time,
        selectedFolder.group_id
      )
      if (!response.ok) {
        console.error('Failed to fetch files:', response.error)
        return
      }

      const files = response.files
        .filter((item) => !item.isDirectory)
        .map((item) => ({
          ...item,
          parent: selectedFolder.path,
          path: `${selectedFolder.date}/${item.path}`
        }))

      const uniqueFiles = []
      files.forEach((item) => {
        if (uniqueFiles.find((f) => f.name === item.name)) return
        uniqueFiles.push(item)
      })

      setFiles(uniqueFiles)
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleCloseModal = () => {
    // 将状态 `showDeleteModal` 设置为 false，触发淡出动画
    setShowDeleteModal(false)

    // 设置一个延迟，以等待动画完成后再移除模态框
    setTimeout(() => {
      // 动画完成后，可以执行其他清理操作，例如重置状态等
    }, 500) // 500ms 与 CSS 中的 transition 时间一致
  }

  const onDownload = async (itemId) => {
    const [date, time] = itemId.split('/')

    try {
      const response = await window.api.downloadReidImages(date, time)
      if (!response.ok) {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Failed to download result:', error)
      setNotificationMessage('Failed to download the result. Please try again.')
      setShowNotificationModal(true)
    }
  }

  return (
    <div className="uploads-view">
      <div className="uploads-folder-list">
        <TreeView
          onSelectedChange={(itemId) => {
            setCurrentFolder(itemId)
            setPreview(null)
          }}
        >
          <TreeList
            folders={detects}
            level={1}
            onDelete={onDelete}
            onRename={onRename}
            onDownload={onDownload}
          />
        </TreeView>
      </div>
      <div className="uploads-file-list">
        {currentFolder ? (
          <PaginateItems
            itemsPerPage={itemsPerPage}
            files={currentFiles}
            selected={selected}
            setSelected={setSelected}
            preview={preview}
            handlePreview={handlePreview}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageCount={pageCount}
            currentItems={currentItems}
            changePage={changePage}
            inputPage={inputPage}
            setInputPage={setInputPage}
            setPreview={setPreview}
          />
        ) : (
          <div className="uploads-file-list-warning">
            You can check your ReID results here. <br></br>Please select a folder from the folder
            tree.
          </div>
        )}
      </div>
      {preview && (
        <Preview
          files={currentFiles}
          preview={preview}
          handlePreview={handlePreview}
          setPreview={setPreview}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          changePage={changePage}
          inputPage={inputPage}
          setInputPage={setInputPage}
          selected={selected}
          setSelected={setSelected}
        />
      )}
      {showDeleteModal &&
        createPortal(
          <Modal
            className="notification-modal"
            show={showDeleteModal}
            onCloseClick={() => handleCloseModal()}
          >
            <div className={styles.renameModalForm}>
              <p>Are you sure you want to delete this record? </p>
              <p>This action is irreversible and cannot be undone! </p>
              <Button
                className={styles.renameSubmitButton}
                onClick={() => handleConfirmDelete(deleteItemId)}
              >
                Confirm
              </Button>
              <Button className={styles.renameSubmitButton} onClick={() => handleCloseModal()}>
                Cancel
              </Button>
            </div>
          </Modal>,
          document.body
        )}
      {showRenameModal &&
        createPortal(
          <Modal
            className="notification-modal"
            show={showRenameModal}
            onCloseClick={() => setShowRenameModal(false)}
          >
            <div className={styles.renameModalForm}>
              <p>Enter the new ID for the group:</p>
              <input
                value={newID}
                onChange={(e) => setNewID(e.target.value)}
                className={styles.renameInput}
              />
              <Button
                className={styles.renameSubmitButton}
                onClick={() => {
                  console.log('Rename confirmed, itemId:', renameItemId)
                  handleConfirmRename(renameItemId)
                }}
              >
                Rename
              </Button>
              <Button
                className={styles.renameSubmitButton}
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Modal>,
          document.body
        )}

      {showNotificationModal &&
        createPortal(
          <Modal
            className="uploader-modal"
            onCloseClick={() => {
              setShowNotificationModal(false)
              // window.location.reload();
            }}
          >
            <div className={styles.renameModalForm}>
              <p>{notificationMessage}</p>
              <Button
                className={styles.renameSubmitButton}
                onClick={() => {
                  setShowNotificationModal(false)
                  // window.location.reload(); // Reload the page after the notification modal is closed
                }}
              >
                OK
              </Button>
            </div>
          </Modal>,
          document.body
        )}
    </div>
  )
}

function TreeList({ folders, parent = '', level = 1, onDelete, onRename, onDownload }) {
  const list = folders.filter((item) => item.parent === (parent === '' ? parent : parent + '/'))

  return list.map((item) => (
    <ReIDTreeItem
      key={item.path}
      itemId={item.path}
      label={item.name}
      level={level}
      onDelete={onDelete}
      onRename={onRename}
      onDownload={onDownload}
    >
      {folders.find((subItem) => subItem.parent === item.path + '/') && (
        <TreeList
          folders={folders}
          parent={item.path}
          level={level + 1}
          onDelete={onDelete}
          onRename={onRename}
          onDownload={onDownload}
        />
      )}
    </ReIDTreeItem>
  ))
}

function PaginateItems({
  itemsPerPage,
  files,
  selected,
  setSelected,
  preview,
  handlePreview,
  currentPage,
  setCurrentPage,
  pageCount,
  currentItems,
  changePage,
  inputPage,
  setInputPage,
  setPreview,
  handleDownload
}) {
  const handleInputPageChange = () => {
    const page = +inputPage
    if (Number.isNaN(page)) {
      setInputPage('')
      return
    }

    if (page <= 0) {
      setCurrentPage(0)
      setInputPage('1')
    } else if (page > pageCount) {
      setCurrentPage(pageCount - 1)
      setInputPage(pageCount.toString())
    } else {
      setCurrentPage(page - 1)
      setInputPage(page.toString())
    }

    handlePreview(files[(page - 1) * itemsPerPage], files)
  }

  useEffect(() => {
    setCurrentPage(0)
    setInputPage('1')
  }, [files])

  if (currentItems.length === 0) {
    return (
      <div className="uploads__list__item uploads__list__item_title uploads__list__header">
        No files found
      </div>
    )
  }

  return (
    <>
      <FileItem
        files={files} // Pass the files prop here
        currentItems={currentItems}
        selected={selected}
        setSelected={setSelected}
        preview={preview}
        handlePreview={handlePreview}
      />
      <div className="pagination-controls">
        <ReactPaginate
          previousLabel={'<'}
          nextLabel={'>'}
          breakLabel={'...'}
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
              if (event.key === 'Enter') {
                handleInputPageChange()
              }
            }}
          />
          <Button
            className="paginationNumberChangeButton button-primary"
            onClick={handleInputPageChange}
          >
            Go
          </Button>
        </div>
      </div>
    </>
  )
}

function Preview({
  files,
  preview,
  handlePreview,
  setPreview,
  itemsPerPage,
  currentPage,
  setCurrentPage,
  changePage,
  inputPage,
  setInputPage,
  selected,
  setSelected
}) {
  const curindex = preview.index
  const curindexmod = curindex % itemsPerPage
  const curPage = Math.floor(curindex / itemsPerPage) + 1

  // Function to navigate to the previous file
  const handlePrev = () => {
    setInputPage(curPage.toString())

    if (curPage != currentPage + 1) {
      setCurrentPage(curPage - 1)
    }

    if (files.length === 0) return

    const prevIndex = curindex > 0 ? curindex - 1 : 0

    if (curindexmod == 0 && prevIndex != 0) {
      setCurrentPage(currentPage - 1)
    }

    handlePreview(files[prevIndex], files)
  }

  // Function to navigate to the next file
  const handleNext = () => {
    setInputPage(curPage.toString())

    if (curPage != currentPage + 1) {
      setInputPage(curPage.toString())
      setCurrentPage(curPage - 1)
    }

    if (files.length === 0) return

    const nextIndex = curindex < files.length - 1 ? curindex + 1 : files.length - 1

    if (curindexmod == itemsPerPage - 1 && nextIndex != files.length - 1) {
      setCurrentPage(currentPage + 1)
    }

    handlePreview(files[nextIndex], files)
  }

  const closePrev = () => {
    setPreview(null)
  }

  return (
    <div className="uploads-preview">
      <div className="uploads-preview__header">
        <Button className="uploads-preview__close-button button-primary" onClick={closePrev}>
          <img alt="Close preview" className="uploads-preview__close-icon" src={closeIcon} />
        </Button>
      </div>
      <div className="preview-header">
        {/* <button
          className="download_button"
          onClick={(e) => {
              e.stopPropagation();
              onDownload(itemId); //onDownload Handle download logic
          }}
          >
          <img
              src={downloadIcon}
              alt="Download"
              className={"downloadIcon"}
          />
          <img
              src={downloadIconOnclick}
              alt="Download"
              className={"downloadIcon downloadIconHover"}
          />
        </button> */}
        <Heading level={2} className="uploads-preview__title">
          {preview.name}
        </Heading>
      </div>
      <img src={preview.src} className="primary-preview" />
      <div className="preview-navigation">
        <div
        // className="preview-checkbox"
        // type="checkbox"
        // checked={selected.has(preview.path)}
        // onChange={(event) => {
        //   setSelected((selected) => {
        //     const newSelected = new Set(selected);
        //     if (event.target.checked) {
        //       newSelected.add(preview.path);
        //     } else {
        //       newSelected.delete(preview.path);
        //     }
        //     return newSelected;
        //   });
        // }}
        ></div>
        <div>
          <Button
            className="button-primary prev-arrows"
            onClick={handlePrev}
            disabled={files.length <= 1}
          >
            Prev
          </Button>
          <Button
            className="button-primary prev-arrows"
            onClick={handleNext}
            disabled={files.length <= 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function FileItem({ files, currentItems, selected, setSelected, preview, handlePreview }) {
  const selectAllRef = useRef()

  useEffect(() => {
    if (selectAllRef.current) {
      const totalFiles = files.length
      const selectedFilesCount = files.filter((file) => selected.has(file.path)).length
      selectAllRef.current.indeterminate = selectedFilesCount > 0 && selectedFilesCount < totalFiles
    }
  }, [files, selected])

  if (currentItems.length === 0) {
    return (
      <div className="uploads__list__item uploads__list__item_title uploads__list__header">
        No files found
      </div>
    )
  }

  return (
    <>
      <ul className="uploads__list__header">
        <li className="uploads__list__item uploads__list__item_title">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={files.every((file) => selected.has(file.path))}
            onChange={() => {
              setSelected((prevSelected) => {
                const newSelected = new Set(prevSelected)
                if (files.every((file) => newSelected.has(file.path))) {
                  files.forEach((file) => newSelected.delete(file.path))
                } else {
                  files.forEach((file) => newSelected.add(file.path))
                }
                return newSelected
              })
            }}
          />
          <div className="uploads__list__item__fileinfo">Select All</div>
        </li>
      </ul>
      <ul className="uploads__list__items">
        {currentItems.map((file, index) => (
          <li
            className={classNames(
              'uploads__list__item',
              file.path === preview?.path && 'file-name-selected'
            )}
            key={`${file.name}-${index}`}
            onClick={() => handlePreview(file, files)}
          >
            <input
              type="checkbox"
              checked={selected.has(file.path)}
              onChange={(event) => {
                setSelected((selected) => {
                  const newSelected = new Set(selected)
                  if (event.target.checked) {
                    newSelected.add(file.path)
                  } else {
                    newSelected.delete(file.path)
                  }
                  return newSelected
                })
              }}
            />
            <span className="file-name">{file.name}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
