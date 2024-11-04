/** @format */
import { Button } from "../../../../components/Button";
import { Formik, Field, Form } from "formik";

import "../../authentication.css";
// import { getCsrfToken } from "../../../../utils/getCsrfToken";
import { useDispatch } from "react-redux";
import {
  add_message,
  bannerStatuses,
} from "../../../../../features/banner/bannerSlice";
import getSiteUrl from "../../../../utils/getSiteUrl";
// import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../hook/auth";
import { useContext } from "react";
import apiClient from '../../../../utils/apiClient';

export default function SigninForm() {
  // const { isAuthenticated } = useAuth0();
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const authContext = useContext(AuthContext);

  const handleSubmit = async (values) => {
    try {
      // Hit a public endpoint to retrieve the CSRF token
      //await fetch(`${getSiteUrl()}/api/public/csrf`, {
        //method: "GET",
        //credentials: "include",
      //});

      //TODO: Update this value with the actual deployed link
      //const res = await fetch(`${getSiteUrl()}/api/public/register`, {
        //method: "POST",
        //credentials: "include",
        //headers: {
          //"Content-Type": "application/json",
          //"X-XSRF-TOKEN": getCsrfToken(),
        //},
        //body: JSON.stringify(values),
      //});

      //if (res.status !== 200) {
        //throw new Error("Registration was not successful");
      //}
      // const res = await fetch(`${getSiteUrl()}/api/auth/login`,{
      //   method:'Post',
      //   headers:{
      //     "Content-Type": "application/json"
      //   },
      //   body:JSON.stringify(values)
      // })
      const res = await apiClient('/api/auth/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const body = await res.json();

      if (res.status != 200){
        throw new Error(body.error)
      }

      authContext.setAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
      navigate(`/upload`)
    } catch (err) {
      console.error(err);
      dispatch(
        add_message({
          message: `${err}`,
          status: bannerStatuses.error,
        })
      );
    }
  };

  // if (authContext.isAuthenticated) {
  // return <Navigate to="/profile" replace={true} />;
  // }

  return (
    <div className="signup__form__wrapper">
      <Formik initialValues={{ username: "",password:"" }} onSubmit={handleSubmit}>
        <Form className="auth__form">
          <div className="input__box">
            <Field
              className="form__input"
              name="username"
              type="string"
              label="username"
              required="required"
              placeholder="username"
            />
          </div>

          <div className="input__box">
            <Field
              className="form__input"
              name="password"
              type="password"
              required="required"
              placeholder="password"
            />
          </div>
         
          <Button className="signup__button" variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Formik>
    </div>
  );
}
