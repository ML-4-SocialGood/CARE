/** @format */

import { createHashRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/home/Home.jsx";
import SignUp from "./pages/Authentication/signup/signup.jsx";
import About from "./pages/about/About.jsx";
import Faq from "./pages/faq/Faq.jsx";
import Upload from "./pages/upload/Upload.jsx";
import Profile from "./pages/profile/Profile.jsx";
import ProfileUser from "./pages/profile/ProfileUser.jsx";
import SitePage from "./components/SitePage.jsx";
import Images from "./pages/images/ViewImages.jsx";
import Uploads from "./pages/uploads/ViewUploads.jsx";
import Users from "./pages/users/Users.jsx";
import UserGuide from "./pages/user-guide/UserGuide.jsx";
import Error from "./components/Error.jsx";
import REIDImageGallery from "./pages/reid/ViewREID.jsx";
import SignIn from "./pages/Authentication/signin/signin.jsx";
import Result from "./pages/result/Result.jsx";

const router = createHashRouter([
  {
    path: "/",
    element: <SitePage component={<Home />} withHeader wrapperClass="home" />,
  },
  {
    path: "signin",
    element: (
      <SitePage component={<SignIn />} withHeader wrapperClass="signin" />
    ),
  },
  {
    path: "signup",
    element: (
      <SitePage component={<SignUp />} withHeader wrapperClass="signin" />
    ),
  },
  {
    path: "upload",
    element: (
      <SitePage component={<Upload />} withHeader wrapperClass="upload" />
    ),
  },
  {
    path: "images",
    element: (
      <SitePage component={<Images />} withHeader wrapperClass="images" />
    ),
  },
  {
    path: "/profile",
    element: (
      <SitePage component={<Profile />} withHeader wrapperClass="profile" />
    ),
  },
  {
    path: "/profile/user",
    element: (
      <SitePage component={<ProfileUser />} withHeader wrapperClass="profile" />
    ),
  },
  {
    path: "/about",
    element: <SitePage component={<About />} withHeader wrapperClass="about" />,
  },
  {
    path: "/help",
    element: <SitePage component={<Faq />} withHeader wrapperClass="faq" />,
  },
  {
    path: "/user-guide",
    element: (
      <SitePage
        component={<UserGuide />}
        withHeader
        wrapperClass="user-guide"
      />
    ),
  },
  {
    path: "/reid",
    element: (
      <SitePage
        component={<REIDImageGallery />}
        withHeader
        wrapperClass="reid-gallery"
      />
    ),
  },
  {
    path: "/uploads",
    element: (
      <SitePage
        component={<Uploads />}
        withHeader
        wrapperClass="uploads-viewer"
      />
    ),
  },
  {
    path: "/result",
    element: (
      <SitePage component={<Result />} withHeader wrapperClass="result-page" />
    ),
  },
  {
    path: "users",
    element: <SitePage component={<Users />} withHeader wrapperClass="users" />,
  },
  {
    path: "*",
    element: <SitePage component={<Error />} withHeader wrapperClass="error" />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
