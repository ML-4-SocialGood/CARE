/** @format */

import './viewuploads.css'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Heading } from '../../components/Heading'
import { add_message, bannerStatuses } from '../../utils/bannerSlice'
import UploadsView from './components/UploadsView'

export default function Uploads() {
  const dispatch = useDispatch()
  const [uploads, setUploads] = useState([])

  useEffect(() => {
    async function getAllUploads(files = [], date = '', folderPath = '') {
      console.log(`date: ${date}`)
      console.log(`folderPath: ${folderPath}`)
      try {
        const response = await window.api.browseImage(date, folderPath)
        if (!response.ok) {
          console.error(`!response.ok: ${response.error}`)
          dispatch(
            add_message({
              message:
                'Something went wrong getting upload information. Please contact a developer for further assistance.',
              status: bannerStatuses.error
            })
          )
          return
        }

        for (const item of response.files) {
          if (!item.isDirectory) continue
          files.push({
            ...item,
            parent: `${date ? date + '/' : ''}${folderPath ? folderPath + '/' : ''}`,
            path: `${date ? date + '/' : ''}${item.path}`
          })
          await getAllUploads(files, date ? date : item.path, date ? item.path : '')
        }

        if (date === '') {
          setUploads(files)
        }
      } catch (err) {
        console.error(`getAllUploads error: ${err}`)
        dispatch(
          add_message({
            message:
              'Something went wrong getting upload information. Please contact a developer for further assistance.',
            status: bannerStatuses.error
          })
        )
      }
    }

    getAllUploads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="uploads-wrapper">
      <Heading className="uploads-h1" level={1}>
        Image Gallery
      </Heading>
      {uploads && uploads?.length > 0 ? (
        <div className="uploads-list">
          <UploadsView uploads={uploads} />
        </div>
      ) : (
        <div className="uploads-list uploads-list--empty">No uploads found</div>
      )}
    </div>
  )
}
