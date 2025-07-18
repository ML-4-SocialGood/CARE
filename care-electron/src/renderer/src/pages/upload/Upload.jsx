/** @format */
import { Heading } from '../../components/Heading'
import ImageUploader from './components/ImageUploader'
import './upload.css'
export default function Upload() {
  return (
    <div className="upload-wrapper">
      <Heading level={1} className="upload-heading1">
        Add Images
      </Heading>
      <ImageUploader />
    </div>
  )
}
