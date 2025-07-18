import { useEffect, useState, useRef, useMemo } from 'react'
import ReactPaginate from 'react-paginate'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { add_message, bannerStatuses } from '../../../utils/bannerSlice'
import closeIcon from '../../../assets/close.png'
import { Button } from '../../../components/Button'
import { Heading } from '../../../components/Heading'
import Modal from '../../../components/Modal'
import TreeItem from '../../../components/TreeItem'
import TreeView from '../../../components/TreeView'
import downloadIcon from '../../../assets/icon-reid-download.svg'
import downloadIconOnclick from '../../../assets/icon-reid-download_onclick.svg'
import classNames from 'classnames'
import Stoat from '@renderer/assets/STOAT.png'

export default function UploadsView({ uploads }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState('')
  const currentFiles = useMemo(
    () => files.filter((item) => item.parent === currentFolder),
    [files, currentFolder]
  )
  const [selected, setSelected] = useState(new Set())
  const [preview, setPreview] = useState(null)

  const [status, setStatus] = useState('')
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(0)
  const pageCount = Math.ceil(files.length / itemsPerPage)

  const [inputPage, setInputPage] = useState('1')
  // const [isSelected, setIsSelected] = useState(false);

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
      const [date, ...paths] = currentFolder.split('/')
      const response = await window.api.browseImage(date, paths.join('/'))
      if (!response.ok) {
        console.log('browseImage ipc failed')
        return
      }
      const files = response.files
        .filter((item) => !item.isDirectory)
        .map((item) => ({
          ...item,
          parent: currentFolder,
          path: `${date}/${item.path.replaceAll('\\', '/')}`
        }))
      setFiles(files)
      if (files.length != 0) {
        handlePreview(files[0], files)
      }
    }
    fetchFiles()
  }, [currentFolder])

  const handlePreview = async (file, files) => {
    const [date, ...paths] = file.path.split('/')
    const response = await window.api.viewImage(date, paths.join('/'))
    if (!response.ok) {
      console.log('viewImage failed: ' + response.error)
      return
    }
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    setPreview({
      path: file.path,
      name: file.name,
      src: URL.createObjectURL(blob),
      index: files.indexOf(file)
    })
  }

  const handleAnalyse = async () => {
    if (status) return
    const streamListener = (_, text) => {
      const lines = new TextDecoder().decode(text).split('\n')
      for (const line of lines) {
        if (/PROCESS: (\d+)\/(\d+)/.test(line)) {
          setCompleted(+RegExp.$1)
          setTotal(+RegExp.$2)
        }
      }
    }
    try {
      setStatus(statuses.processing)
      window.api.addStreamListener(streamListener)
      const selectedPaths = Array.from(selected)
      const response = await window.api.detect(selectedPaths)
      if (!response.ok) {
        setStatus('')
        throw new Error('detection failed: ' + response.error)
      }
      setTimeout(() => navigate('/images'), 1000)
    } catch (err) {
      setStatus('')
      console.error(err)
      dispatch(
        add_message({
          message: `${err}`,
          status: bannerStatuses.error
        })
      )
    } finally {
      window.api.removeStreamListener(streamListener)
    }
  }

  const handleSelectAll = async () => {
    const response = await window.api.getImagePaths(currentFolder)
    if (response.ok) {
      const newSelected = new Set(selected)
      response.selectAllPaths.forEach((item) => {
        newSelected.add(item.replaceAll('\\', '/'))
      })
      setSelected(newSelected)
    }
  }

  const handleDeselectAll = async () => {
    const response = await window.api.getImagePaths(currentFolder)
    if (response.ok) {
      const newSelected = new Set(selected)
      response.selectAllPaths.forEach((item) => {
        newSelected.delete(item.replaceAll('\\', '/'))
      })
      setSelected(newSelected)
    }
  }

  async function selectInputs() {
    // get all paths with current folder
    const response = await window.api.getImagePaths(currentFolder)
    // check if all paths are in current selections
    if (response.ok) {
      if (response.selectAllPaths.every((file) => selected.has(file.replaceAll('\\', '/')))) {
        return true
      } else {
        return false
      }
    }
  }

  const onDownload = async (file) => {
    const [date, ...paths] = file.path.split('/')

    try {
      const response = await window.api.viewImage(date, paths.join('/'))
      if (!response.ok) {
        const body = response
        throw new Error(body.error)
      }
      const filename = `${file.name}`
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (error) {
      console.error('Failed to download result:', error)
      setNotificationMessage('Failed to download the result. Please try again.')
      setShowNotificationModal(true)
    }
  }

  const handleDownload = async () => {
    try {
      const selectedPaths = Array.from(selected)
      const response = await window.api.downloadSelectedGalleryImages(selectedPaths)
      if (!response.ok) {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error(err)
      dispatch(
        add_message({
          message: `${err}`,
          status: bannerStatuses.error
        })
      )
    }
  }

  return (
    <div className="uploads-view">
      <div className="uploads-folder-list">
        <div className="uploads-folder-container">
          <TreeView
            onSelectedChange={async (itemId) => {
              setCurrentFolder(itemId)
              setPreview(null)
            }}
          >
            <TreeList folders={uploads}></TreeList>
          </TreeView>
        </div>
      </div>
      <div className="uploads-file-list">
        {currentFolder ? (
          <PaginateItems
            itemsPerPage={itemsPerPage}
            files={currentFiles}
            selected={selected}
            setSelected={setSelected}
            handleAnalyse={handleAnalyse}
            preview={preview}
            handlePreview={handlePreview}
            handleSelectAll={handleSelectAll}
            handleDeselectAll={handleDeselectAll}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageCount={pageCount}
            currentItems={currentItems}
            changePage={changePage}
            inputPage={inputPage}
            setInputPage={setInputPage}
            setPreview={setPreview}
            handleDownload={handleDownload}
            selectInputs={selectInputs}
          />
        ) : (
          <div className="uploads-file-list-warning">
            You can check your added images here. <br />
            Please select a folder from the folder tree.
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
          onDownload={onDownload}
        />
      )}
      {status &&
        createPortal(
          <>
            {/* Mask that blocks interaction outside the modal */}
            <div className="modal-mask"></div>
            <Modal
              className="uploader-modal"
              onCloseClick={() => {
                setStatus('') // Clear the status first
                terminateAIAndRefresh()
              }}
            >
              {generateModalContent(status, completed, total)}
            </Modal>
            ,
          </>,
          document.body
        )}
    </div>
  )
}

const terminateAIAndRefresh = async () => {
  try {
    await window.api.terminateAI()
    // Once the API call is successful, refresh the page
    window.location.reload()
  } catch (error) {
    console.error('Error during AI termination:', error)
  }
}

function TreeList({ folders, parent = '' }) {
  const list = folders.filter((item) => item.parent === (parent === '' ? parent : parent + '/'))

  return list.map((item) => (
    <TreeItem key={item.path} itemId={item.path} label={item.name}>
      {folders.find((subItem) => subItem.parent === item.path + '/') && (
        <TreeList folders={folders} parent={item.path} />
      )}
    </TreeItem>
  ))
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
  handleDeselectAll,
  currentPage,
  setCurrentPage,
  pageCount,
  currentItems,
  changePage,
  inputPage,
  setInputPage,
  setPreview,
  handleDownload,
  selectInputs
}) {
  const [allSelected, setAllSelected] = useState(null)

  useEffect(() => {
    const getResult = async () => {
      const result = await selectInputs()
      setAllSelected(result)
    }

    getResult()
  })

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
      <>
        <div className="uploads__list__item uploads__list__item_title uploads__list__header">
          <div className="uploads__list__item__fileinfo">
            {selected.size > 0 ? selected.size + ' ' : 'No '}
            files found
            <div className="heading-buttons-container">
              {allSelected ? (
                <Button className="heading-buttons button-primary" onClick={handleDeselectAll}>
                  Deselect all with subfolders
                </Button>
              ) : (
                <Button className="heading-buttons button-primary" onClick={handleSelectAll}>
                  Select all with subfolders
                </Button>
              )}
            </div>
          </div>
        </div>
        <Button
          className="downloadSelected-button button-primary"
          onClick={handleDownload}
          disabled={selected.size === 0} // Disable if nothing is selected
        >
          Save Selected
          {selected.size > 0 && <span className="upload-button-count">{selected.size}</span>}
        </Button>
        <Button
          className="analyse-button button-primary"
          onClick={handleAnalyse}
          disabled={selected.size === 0} // Disable if nothing selected
        >
          Run Detection
          {selected.size > 0 && <span className="upload-button-count">{selected.size}</span>}
        </Button>
      </>
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
        handleSelectAll={handleSelectAll}
        handleDeselectAll={handleDeselectAll}
        allSelected={allSelected}
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
      <Button
        className="downloadSelected-button button-primary"
        onClick={handleDownload}
        disabled={selected.size === 0} // Disable if nothing is selected
      >
        Save Selected
        {selected.size > 0 && <span className="upload-button-count">{selected.size}</span>}
      </Button>
      {/* "Run Detection" button always visible */}
      <Button
        className="analyse-button button-primary"
        onClick={handleAnalyse}
        disabled={selected.size === 0} // Disable if nothing selected
      >
        Run Detection
        {selected.size > 0 && <span className="upload-button-count">{selected.size}</span>}
      </Button>
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
  setSelected,
  onDownload
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
        <button
          className="download_button"
          onClick={(e) => {
            e.stopPropagation()
            onDownload(preview)
          }}
        >
          <img src={downloadIcon} alt="Download" className={'downloadIcon'} />
          <img
            src={downloadIconOnclick}
            alt="Download"
            className={'downloadIcon downloadIconHover'}
          />
        </button>
        <Heading level={2} className="uploads-preview__title">
          {preview.name}
        </Heading>
      </div>
      <img src={preview.src} className="primary-preview" />
      <div className="preview-navigation">
        <input
          className="preview-checkbox"
          type="checkbox"
          checked={selected.has(preview.path)}
          onChange={(event) => {
            setSelected((selected) => {
              const newSelected = new Set(selected)
              if (event.target.checked) {
                newSelected.add(preview.path)
              } else {
                newSelected.delete(preview.path)
              }
              return newSelected
            })
          }}
        ></input>
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

function FileItem({
  files,
  currentItems,
  selected,
  setSelected,
  preview,
  handlePreview,
  handleSelectAll,
  handleDeselectAll,
  allSelected
}) {
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
        <div className="uploads__list__item__fileinfo">
          {selected.size > 0 ? selected.size + ' ' : 'No '}
          files found
          <div className="heading-buttons-container">
            {allSelected ? (
              <Button className="heading-buttons button-primary" onClick={handleDeselectAll}>
                Deselect all with subfolders
              </Button>
            ) : (
              <Button className="heading-buttons button-primary" onClick={handleSelectAll}>
                Select all with subfolders
              </Button>
            )}
          </div>
        </div>
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
          <div className="uploads__list__item__fileinfo">
            Select All
            <div className="heading-buttons-container">
              {allSelected ? (
                <Button className="heading-buttons button-primary" onClick={handleDeselectAll}>
                  Deselect all with subfolders
                </Button>
              ) : (
                <Button className="heading-buttons button-primary" onClick={handleSelectAll}>
                  Select all with subfolders
                </Button>
              )}
            </div>
          </div>
        </li>
      </ul>
      <ul className="uploads__list__items">
        {currentItems.map((file, index) => (
          <li
            className={classNames(
              'uploads__list__item uploads__list__subitem',
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

const statuses = {
  initial: 'Initial',
  uploading: 'Uploading',
  processing: 'Processing',
  error: 'Error',
  success: 'Success',
  done: 'Done'
}

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
    )
  }

  if (status === statuses.error) {
    return (
      <>
        <Heading className="modal__heading" level={3}>
          There has been an error.
        </Heading>
        <p>Please contact an administrator for assistance.</p>
      </>
    )
  }

  if (status === statuses.processing) {
    return (
      <>
        <span className="loader"></span>
        <Heading className="modal__heading" level={3}>
          Detection in progress...
        </Heading>
        <p>
          The detection AI model is processing your selected images. This is a long-running task.{' '}
          <br />A progress bar will appear if the AI server successfully receives your images.
          Thanks for your patience.
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
                src={Stoat}
                className="progress-icon"
                style={{
                  left: `${Math.floor((completed / total) * 100) - 2}%`
                }}
              />
            </div>
            <span>{Math.floor((completed / total) * 100)}%</span>
          </div>
        )}
      </>
    )
  }
}
