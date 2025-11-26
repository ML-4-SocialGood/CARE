/** @format */

import React from 'react'
import clsx from 'clsx'
import upload from '../../../assets/upload.png'
import { acceptedFileTypes } from '../constants/acceptedFileTypes'
import { Heading } from '../../../components/Heading'
import { Button } from '../../../components/Button'
import { createPortal } from 'react-dom'
import Modal from '../../../components/Modal'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Stoat from '@renderer/assets/STOAT.png'

import { add_message, bannerStatuses } from '../../../utils/bannerSlice'

const statuses = {
  initial: 'Initial',
  uploading: 'Uploading',
  processing: 'Processing',
  error: 'Error',
  success: 'Success',
  done: 'Done'
}

function generateModalContent(status, loadedFileCount, totalCount) {
  if (status === statuses.uploading) {
    return (
      <>
        <span className="loader"></span>
        <Heading className="modal__heading" level={3}>
          Uploading in progress...
        </Heading>
        <p>Selected folder is uploading...</p>
        <p>Notice: Non-jpg files will be ignored.</p>

        <div className="progress-container">
          <span>
            {loadedFileCount} / {totalCount}
          </span>
          <div className="progress-wrapper">
            <progress
              className="progress"
              value={Math.floor((loadedFileCount / totalCount) * 100)}
              max="100"
            >
              {Math.floor((loadedFileCount / totalCount) * 100)}%
            </progress>
            <img
              src={Stoat}
              className="progress-icon"
              style={{
                left: `${Math.floor((loadedFileCount / totalCount) * 100) - 2}%`
              }}
            />
          </div>
          <span>{Math.floor((loadedFileCount / totalCount) * 100)}%</span>
        </div>
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
        <Heading className="modal__heading" level={3}>
          Processing in progress
        </Heading>
        <p>
          AI analysis is now underway. This is a long-running task. <br />
          Check the progress by viewing
          <Link className="modal__link" to="/uploads">
            &nbsp;uploads&nbsp;
          </Link>
          or visiting the
          <Link className="modal__link" to="/images">
            &nbsp;gallery
          </Link>
          .
        </p>
      </>
    )
  }
}

function verifyImage(file) {
  if (!acceptedFileTypes.find((t) => t === file.type)) {
    return false
  }

  return true
}

export default function ImageUploader() {
  const [files, setFiles] = React.useState([])
  const [status, setStatus] = React.useState(statuses.initial)
  const [dragging, setDragging] = React.useState(false)
  const [showModal, setShowModal] = React.useState(false)
  const dispatch = useDispatch()
  const inputRef = React.useRef(null)
  const [loading] = React.useState(false)
  const [loadedFileCount, setLoadedFileCount] = React.useState(0)
  const [currentFolder, setCurrentFolder] = React.useState('')
  const [folders, setFolders] = React.useState([])
  const navigate = useNavigate()

  const handleDragOver = (e) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragging(false)
  }

  const handleDrop = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    const filesToAdd = []
    const foldersToAdd = []

    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const fileToAdd = e.dataTransfer.items[i]
      const entry = await fileToAdd.getAsFileSystemHandle()
      if (entry.kind === 'directory') {
        await handleDirectoryEntry(filesToAdd, entry, foldersToAdd, entry.name)
      } else {
        await handleFileEntry(filesToAdd, entry)
      }
    }

    setFiles([...files, ...filesToAdd])
    setFolders(foldersToAdd)
    setDragging(false)
  }

  const handleDirectoryEntry = async (files, folderEntry, folders, folder) => {
    if (!folders.includes(folder)) {
      // 将该文件夹添加进文件夹列表中（去重）
      folders.push(folder)
    }
    console.log('Folders:', folders) // 调试：打印所有文件夹
    for await (const entry of folderEntry.values()) {
      if (entry.kind === 'directory') {
        await handleDirectoryEntry(files, entry, folders, `${folder}/${entry.name}`)
      } else {
        await handleFileEntry(files, entry, folder)
      }
    }
  }

  const handleFileEntry = async (files, fileEntry, folder = '') => {
    const file = await fileEntry.getFile()
    const validImage = verifyImage(file)

    if (validImage) {
      file._webkitRelativePath = `${folder}/${file.name}`
      files.push(file)
    } else {
      dispatch(
        add_message({
          message: `Not all files were added. Accepted file type is jpeg.`,
          status: bannerStatuses.error
        })
      )
    }
  }

  const handleOnChange = (e) => {
    const filesToAdd = []
    const foldersToAdd = []
    for (let i = 0; i < e.target.files.length; i++) {
      const fileToAdd = e.target.files[i]

      if (verifyImage(fileToAdd)) {
        filesToAdd.push(fileToAdd)

        const filePath = fileToAdd.webkitRelativePath // 返回的是 a/b.txt
        const folder = filePath.substring(0, filePath.lastIndexOf('/')) // 这里我们需要获取该文件的真实路径，也就是 a， 所以我们需要去掉 /b.txt
        const topFolder = folder.split('/')[0] // 获取顶级文件夹，如 'Stoat_Capital_Kiwi'

        if (!foldersToAdd.includes(topFolder)) {
          foldersToAdd.push(topFolder) // 仅添加不重复的顶级文件夹
        }

        fileToAdd._webkitRelativePath = fileToAdd.webkitRelativePath
      }
    }

    console.log('Folders:', foldersToAdd) // 调试：查看文件夹是否被正确识别
    setFiles(filesToAdd)
    setCurrentFolder('') // 这里我们定义根目录为 '' 空字符串，子目录为 a/b，也就是不以斜杠开头
    setFolders(foldersToAdd)
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleButtonKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault()
      handleButtonClick()
    }
  }

  const handleUploadClick = async () => {
    try {
      setStatus(statuses.uploading)
      setShowModal(true)
      setLoadedFileCount(0)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Check file extension is .jpg
        const isJpgExtension = file.name.toLowerCase().endsWith('.jpg')
        // Check MIME type is image/jpeg
        const isJpegMime = file.type === 'image/jpeg'

        if (isJpgExtension && isJpegMime) {
          // Send the file to the server
          const data = new Uint8Array(await file.arrayBuffer())
          const response = await window.api.uploadImage(file._webkitRelativePath, data)
          if (!response.ok) {
            console.log('Failed to upload image. ' + response.error)
          }
          setLoadedFileCount(i + 1)
        }
      }

      setTimeout(() => {
        navigate('/uploads')
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      setStatus(statuses.error)
      dispatch(
        add_message({
          message: `${error}`,
          status: bannerStatuses.error
        })
      )
    }
  }

  return (
    <>
      <div
        className="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          className={clsx('drop-zone__button', dragging && `drop-zone__button-active`)}
          type="button"
          onKeyDown={handleButtonKeyDown}
          onClick={handleButtonClick}
        >
          <img className="drop-zone__button__icon" src={upload} alt="Upload images" />
          Drag and drop folder
          <br />
          or
          <div className={clsx('button', 'button-primary', 'drop-zone__button__target')}>
            Click to Add
          </div>
        </button>
        <label htmlFor="file_uploader" className="visually-hidden">
          Drag and drop folder or click to add
        </label>
        <input
          className="visually-hidden"
          id="file_uploader"
          ref={inputRef}
          type="file"
          accept={acceptedFileTypes.join(',')}
          multiple
          onChange={handleOnChange}
          webkitdirectory="true"
        />
      </div>
      {/*进度条*/}
      {loading ? (
        <div className="progress-container">
          <span>
            {loadedFileCount} / {files.length}
          </span>
          <div className="progress-wrapper">
            <progress
              className="progress"
              value={Math.floor((loadedFileCount / files.length) * 100)}
              max="100"
            >
              {Math.floor((loadedFileCount / files.length) * 100)}%
            </progress>
            <img
              src={Stoat}
              className="progress-icon"
              style={{
                left: `${Math.floor((loadedFileCount / files.length) * 100) - 2}%`
              }}
            />
          </div>
          <span>{Math.floor((loadedFileCount / files.length) * 100)}%</span>
        </div>
      ) : (
        <>
          {createFileList(files, setFiles, currentFolder, setCurrentFolder, folders)}
          {files.length ? (
            <Button
              className="upload-button"
              variant="primary"
              onClick={handleUploadClick}
              disabled={status === statuses.uploading}
            >
              Add Images
            </Button>
          ) : null}
          {showModal &&
            createPortal(
              <>
                {/* Mask that blocks interaction outside the modal */}
                <div className="modal-mask"></div>

                <Modal
                  className="uploader-modal"
                  onCloseClick={() => {
                    setShowModal(false)
                    window.location.reload()
                  }}
                >
                  {generateModalContent(status, loadedFileCount, files.length)}
                </Modal>
              </>,
              document.body
            )}
        </>
      )}
    </>
  )
}

const createFileList = (files, setFiles, currentFolder, setCurrentFolder, folders) => {
  const currentFolders = folders.filter((item) => {
    if (currentFolder === '') {
      // 根目录下，只显示不包含 `/` 的文件夹（即一级目录）
      return item.split('/').length === 1
    } else {
      // 子目录中，显示以当前文件夹开头的直接子目录
      return (
        item.startsWith(`${currentFolder}/`) &&
        item.split('/').length === currentFolder.split('/').length + 1
      )
    }
  })

  console.log('Current Folder:', currentFolder) // 调试：当前所在目录
  console.log('All Folders:', folders) // 调试：所有文件夹列表
  console.log('Filtered Current Folders:', currentFolders) // 调试：过滤后的文件夹

  // 获取当前路径内的文件列表
  const currentFiles = files.filter(
    (item) =>
      item._webkitRelativePath.substring(0, item._webkitRelativePath.lastIndexOf('/')) ===
      currentFolder
  )

  if (files.length) {
    return (
      <div className="uploads">
        <div className="uploads__title">
          {/* <Heading level={2}>Selected Folder</Heading> */}
          <Heading level={2}>Images list</Heading>
          <Button className="uploads__clear-all" onClick={() => setFiles([])}>
            Clear all
          </Button>
        </div>
        <div className="uploads__scrollable-container">
          <ul className="uploads__list">
            {currentFolder !== '' && (
              <li className="uploads__list__item" key="prev">
                <div
                  className="uploads__list__item__folderinfo"
                  onClick={() => {
                    if (currentFolder.includes('/')) {
                      setCurrentFolder(currentFolder.substring(0, currentFolder.lastIndexOf('/')))
                    } else {
                      setCurrentFolder('')
                    }
                  }}
                >
                  ..
                </div>
              </li>
            )}

            {/* 文件夹列表（从文件列表复制） */}
            {currentFolders.map((folder, index) => (
              <li className="uploads__list__item" key={`${folder}-${index}}`}>
                {/* 这里我们要添加一个点击事件，当点击文件夹名字后，跳转到子目录（因为可点击，所以我们需要修改下默认样式） */}
                <div className="uploads__list__item__folderinfo">
                  {console.log('Folder Name:', folder)} {/* 调试：检查渲染的文件夹名称 */}
                  {currentFolder === '' ? folder : folder.substring(currentFolder.length + 1)}
                </div>
              </li>
            ))}
            {/* 文件列表：原来显示所有文件，现在要改成当前目录的文件列表 */}
            {currentFiles.map((file, index) => (
              <li className="uploads__list__item" key={`${file.name}-${index}}`}>
                <div className="uploads__list__item__fileinfo">
                  <img
                    className="file-preview"
                    src={URL.createObjectURL(file)}
                    onLoad={() => {
                      URL.revokeObjectURL(file)
                    }}
                  />
                  {file.name}
                </div>
                <Button
                  ariaLabel={`Remove file ${file.name}`}
                  className="file-remove"
                  onClick={(e) => {
                    e.preventDefault()
                    setFiles([...files.slice(0, index), ...files.slice(index + 1)])
                  }}
                >
                  {/* Adapted from https://codepen.io/shunyadezain/pen/yLJMgxy */}
                  <div className="trash">
                    <div className="trash__top"></div>
                    <div className="trash__btm">
                      <div className="trash__lines">
                        <div className="trash__line"></div>
                        <div className="trash__line"></div>
                      </div>
                    </div>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  } else {
    return null
  }
}
