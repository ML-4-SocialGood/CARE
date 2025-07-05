/** @format */

import { createHashRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/home/Home.jsx'
import About from './pages/about/About.jsx'
import Faq from './pages/faq/Faq.jsx'
import Upload from './pages/upload/Upload.jsx'
import SitePage from './components/SitePage.jsx'
import Images from './pages/images/ViewImages.jsx'
import Uploads from './pages/uploads/ViewUploads.jsx'
import UserGuide from './pages/user-guide/UserGuide.jsx'
import Error from './components/Error.jsx'
import REIDImageGallery from './pages/reid/ViewREID.jsx'
import Result from './pages/result/Result.jsx'

const router = createHashRouter([
  {
    path: '/',
    element: <SitePage component={<Home />} withHeader wrapperClass="home" />
  },
  {
    path: 'upload',
    element: <SitePage component={<Upload />} withHeader wrapperClass="upload" />
  },
  {
    path: 'images',
    element: <SitePage component={<Images />} withHeader wrapperClass="images" />
  },
  {
    path: '/about',
    element: <SitePage component={<About />} withHeader wrapperClass="about" />
  },
  {
    path: '/help',
    element: <SitePage component={<Faq />} withHeader wrapperClass="faq" />
  },
  {
    path: '/user-guide',
    element: <SitePage component={<UserGuide />} withHeader wrapperClass="user-guide" />
  },
  {
    path: '/reid',
    element: <SitePage component={<REIDImageGallery />} withHeader wrapperClass="reid-gallery" />
  },
  {
    path: '/uploads',
    element: <SitePage component={<Uploads />} withHeader wrapperClass="uploads-viewer" />
  },
  {
    path: '/result',
    element: <SitePage component={<Result />} withHeader wrapperClass="result-page" />
  },
  {
    path: '*',
    element: <SitePage component={<Error />} withHeader wrapperClass="error" />
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
