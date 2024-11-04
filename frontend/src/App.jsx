/** @format */

import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/home/Home.jsx";
import SignUp from "./pages/Authentication/signup/signup.jsx";
import About from "./pages/about/About.jsx";
import Faq from "./pages/faq/Faq.jsx";
import Upload from "./pages/upload/Upload.jsx";
import Profile from "./pages/profile/Profile.jsx";
import ProfileUser from "./pages/profile/ProfileUser.jsx";
import SitePage from "./components/SitePage.jsx";
import Stoats from "./pages/stoats/Stoats.jsx";
import Images from "./pages/images/ViewImages.jsx";
import StoatProfile from "./pages/stoats/StoatProfile.jsx";
import Uploads from "./pages/uploads/ViewUploads.jsx";
import Users from "./pages/users/Users.jsx";
import CreateStoat from "./pages/stoats/CreateStoat.jsx";
import UploadPage from "./pages/uploads/UploadPage.jsx";
import UserGuide from "./pages/user-guide/UserGuide.jsx";
import Error from "./components/Error.jsx"
import REIDImageGallery from "./pages/reid/ViewREID.jsx";
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchStoats } from "../features/stoat/stoatSlice";
import { fetchStatuses, fetchUploads } from "../features/upload/uploadSlice.js";
import { add_message, bannerStatuses } from "../features/banner/bannerSlice.js";
import { fetchImages } from "../features/image/imageSlice.js";
import SignIn from "./pages/Authentication/signin/signin.jsx";
import Result from "./pages/result/Result.jsx";

const router = createHashRouter([
  {
    path: "/",
    element: <SitePage component={<Home />} withHeader wrapperClass="home" />,
  },
  {
    path: "signin",
    element: <SitePage component={<SignIn />} withHeader wrapperClass="signin" />,
  },
  {
    path: "signup",
    element: <SitePage component={<SignUp />} withHeader wrapperClass="signin" />,
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
    element: (
      <SitePage component={<About />} withHeader wrapperClass="about" />
    ),
  },
  {
    path: "/help",
    element: (
      <SitePage component={<Faq />} withHeader wrapperClass="faq" />
    ),
  },
  {
    path: "/user-guide",
    element: (
      <SitePage component={<UserGuide />} withHeader wrapperClass="user-guide" />
    ),
  },
  {
    path: "/reid",
    element: (
        <SitePage component={<REIDImageGallery />} withHeader wrapperClass="reid-gallery" />
    ),
  },
  {
    path: "stoats",
    element: (
      <SitePage component={<Stoats />} withHeader wrapperClass="stoats" />
    ),
  },
  {
    path: "stoats/new",
    element: (
      <SitePage
        component={<CreateStoat />}
        withHeader
        wrapperClass="new-stoat"
      />
    ),
  },
  {
    path: "stoats/:stoatId",
    element: (
      <SitePage component={<StoatProfile />} withHeader wrapperClass="stoats" />
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
    path: "/uploads/:uploadId",
    element: (
      <SitePage
        component={<UploadPage />}
        withHeader
        wrapperClass="upload-page"
      />
    ),
  },
  {
    path: "/result",
    element:  (
      <SitePage
        component={<Result />}
        withHeader
        wrapperClass="result-page"
      />
    ),
  },
  {
    path: "users",
    element: <SitePage component={<Users />} withHeader wrapperClass="users" />,
  },
  {
    path: "*",
    element: (
      <SitePage component={<Error />} withHeader wrapperClass="error" />
    ),
  },

]);

// import.meta.env.VITE_APP_PULL_REQUEST === "true"
//   ? createHashRouter([
//       {
//         path: "/",
//         element: (
//           <SitePage component={<Home />} withHeader wrapperClass="home" />
//         ),
//       },
//       {
//         path: "upload",
//         element: (
//           <SitePage component={<Upload />} withHeader wrapperClass="upload" />
//         ),
//       },
//       {
//         path: "images",
//         element: (
//           <SitePage component={<Images />} withHeader wrapperClass="images" />
//         ),
//       },

//       // {
//       //   path: "/signup",
//       //   element: <SignUp />,
//       // },
//       {
//         path: "stoats",
//         element: (
//           <SitePage component={<Stoats />} withHeader wrapperClass="stoats" />
//         ),
//       },
//       {
//         path: "stoats/new",
//         element: (
//           <SitePage
//             component={<CreateStoat />}
//             withHeader
//             wrapperClass="new-stoat"
//           />
//         ),
//       },
//       {
//         path: "stoats/:stoatId",
//         element: (
//           <SitePage
//             component={<StoatProfile />}
//             withHeader
//             wrapperClass="stoats"
//           />
//         ),
//       },
//       {
//         path: "users",
//         element: (
//           <SitePage component={<Users />} withHeader wrapperClass="users" />
//         ),
//       },
//     ])
//   : createBrowserRouter([
//       {
//         path: "/",
//         element: (
//           <SitePage component={<Home />} withHeader wrapperClass="home" />
//         ),
//       },
//       {
//         path: "/upload",
//         element: (
//           <SitePage component={<Upload />} withHeader wrapperClass="upload" />
//         ),
//       },
//       {
//         path: "/images",
//         element: (
//           <SitePage component={<Images />} withHeader wrapperClass="images" />
//         ),
//       },
//       {
//            path: "/about",
//           element: (
//              <SitePage component={<About />} withHeader wrapperClass="about" />
//            ),
//          },
//          {
//            path: "/faq",
//            element: (
//              <SitePage component={<Faq />} withHeader wrapperClass="faq" />
//            ),
//          },
//       {
//         path: "/profile",
//         element: (
//           <SitePage
//             component={<Profile />}
//             withHeader
//             wrapperClass="profile"
//           />
//         ),
//       },
//       // {
//       //   path: "/signup",
//       //   element: <SitePage component={<SignUp />} />,
//       // },
//       {
//         path: "/stoats",
//         element: (
//           <SitePage component={<Stoats />} withHeader wrapperClass="stoats" />
//         ),
//       },
//       {
//         path: "/stoats/new",
//         element: (
//           <SitePage
//             component={<CreateStoat />}
//             withHeader
//             wrapperClass="new-stoat"
//           />
//         ),
//       },
//       {
//         path: "/stoats/:stoatId",
//         element: (
//           <SitePage
//             component={<StoatProfile />}
//             withHeader
//             wrapperClass="stoats"
//           />
//         ),
//       },
//       {
//         path: "/uploads",
//         element: (
//           <SitePage
//             component={<Uploads />}
//             withHeader
//             wrapperClass="uploads-viewer"
//           />
//         ),
//       },
//       {
//         path: "/uploads/:uploadId",
//         element: (
//           <SitePage
//             component={<UploadPage />}
//             withHeader
//             wrapperClass="upload-page"
//           />
//         ),
//       },
//       {
//         path: "/users",
//         element: (
//           <SitePage component={<Users />} withHeader wrapperClass="users" />
//         ),
//       },
//     ]);

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const uploadsStatus = useSelector((state) => state.uploads.status);
  const uploadsErrorMessage = useSelector((state) => state.uploads.error);
  const stoatsStatus = useSelector((state) => state.stoats.status);
  const images = useSelector((state) => state.images.value);
  const stoatsErrorMessage = useSelector((state) => state.stoats.error);
  const imagesStatus = useSelector((state) => state.images.status);
  const imagesErrorMessage = useSelector((state) => state.images.error);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let accessToken;

    async function getAccessToken() {
      try {
        accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: `https://projectcare/api`,
          },
        });
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message:
              "Something went wrong during authentication. Please contact a developer for further assistance.",
            status: bannerStatuses.error,
          })
        );
      }
    }

    // Fetch all shared data required for application
    async function getUploads() {
      await getAccessToken();
      dispatch(fetchUploads(accessToken));
    }

    async function getStoats() {
      await getAccessToken();
      dispatch(fetchStoats(accessToken));
    }

    if (uploadsStatus === fetchStatuses.idle) {
      getUploads();
    }

    if (uploadsStatus === fetchStatuses.failed) {
      dispatch(
        add_message({
          message:
            "Something went wrong fetching upload data. Please contact a developer for assistance.",
          status: bannerStatuses.error,
        })
      );
    }

    if (stoatsStatus === fetchStatuses.idle) {
      getStoats();
    }

    if (stoatsStatus === fetchStatuses.failed) {
      dispatch(
        add_message({
          message:
            "Something went wrong fetching stoat data. Please contact a developer for assistance.",
          status: bannerStatuses.error,
        })
      );
    }
  }, [
    uploadsStatus,
    dispatch,
    getAccessTokenSilently,
    isAuthenticated,
    uploadsErrorMessage,
    stoatsStatus,
    stoatsErrorMessage,
  ]);

  // useEffect(() => {
  //   async function test() {
  //     const a = await getAccessTokenSilently({
  //       authorizationParams: {
  //         audience: `https://projectcare/api`,
  //       },
  //     });

  //     dispatch(fetchImages({ accessToken: a }));
  //   }

  //   test();
  // }, [dispatch, getAccessTokenSilently, images]);

  return <RouterProvider router={router} />;
}

export default App;
