import { useState } from 'react'
import closeIcon from '../../../assets/close.png'
import { Button } from '../../../components/Button.jsx'
import { Heading } from '../../../components/Heading.jsx'
import TreeItem from '../../../components/TreeItem.jsx'
import TreeView from '../../../components/TreeView.jsx'

export default function ResultView({ folders, files }) {
  const [currentFolder, setCurrentFolder] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [preview, setPreview] = useState(null)

  const handlePreview = async (file) => {
    const [date, ...paths] = file.path.split('/')
    const response = await window.api.viewDetectImage(date, paths.join('/'))
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    setPreview({
      name: file.name,
      src: URL.createObjectURL(blob)
    })
  }

  return (
    <div className="uploads-view">
      <div className="uploads-folder-list">
        <TreeView onSelectedChange={(itemId) => setCurrentFolder(itemId)}>
          <TreeList folders={folders}></TreeList>
        </TreeView>
      </div>
      <div className="uploads-file-list">
        {currentFolder ? (
          <FileList
            files={files.filter((item) => item.parent === currentFolder)}
            selected={selected}
            setSelected={setSelected}
            handlePreview={handlePreview}
          ></FileList>
        ) : (
          <div className="uploads-file-list-warning">Welcome to your Result Gallery</div>
        )}
      </div>
      {preview && (
        <div className="uploads-preview">
          <div className="uploads-preview__title">
            <Heading level={2}>{preview.name}</Heading>
            <Button
              className="uploads-preview__close-button"
              onClick={() => {
                setPreview(null)
              }}
            >
              <img alt="Close preview" className="uploads-preview__close-icon" src={closeIcon} />
            </Button>
          </div>
          <img src={preview.src} className="primary-preview" />
        </div>
      )}
    </div>
  )
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

function FileList({ files, selected, setSelected, handlePreview }) {
  if (files.length) {
    return (
      <div className="uploads">
        <div className="uploads__title">
          <Heading level={2}>Image List</Heading>
        </div>
        <div className="uploads__scrollable-container">
          <ul className="uploads__list">
            <li className="uploads__list__item uploads__list__item_title">
              <input
                type="checkbox"
                checked={files.every((file) => selected.has(file.path))}
                onChange={() => {
                  setSelected(() => {
                    const newSelected = new Set(selected)
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
            {files.map((file, index) => (
              <li className="uploads__list__item" key={`${file.name}-${index}}`}>
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
                <div className="uploads__list__item__fileinfo">
                  {/* <img
                  className="file-preview"
                  src={file.src}
                  onClick={() => setPreview(file)}
                /> */}
                  <span className="file-name" onClick={() => handlePreview(file)}>
                    {file.name}
                  </span>
                </div>
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
