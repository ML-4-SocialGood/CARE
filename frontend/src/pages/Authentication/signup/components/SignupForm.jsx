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
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import apiClient from '../../../../utils/apiClient';

export default function SignUpForm() {
  const { isAuthenticated } = useAuth0();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      // const res = await fetch(`${getSiteUrl()}/api/auth/register`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(values),
      // });
      const res = await apiClient('/api/auth/register', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const body = await res.json();

      if (res.status !== 201){
        throw new Error(body.error)
      }

      dispatch(
        add_message({
          message: `${body.message}`,
          status: bannerStatuses.success,
        })
      );
      navigate("/signin");

      // if (res.status === 201) {
      //   // 作业2️⃣：注册成功时，检查状态码为201
      //   dispatch(
      //     add_message({
      //       message: "Registration successful!",
      //       status: bannerStatuses.success,
      //     })
      //   );
      //   navigate("/signin"); // 注册成功后跳转到登录页面
      // } else {
      //   const body = await res.json();
      //   throw new Error(body.error || "Registration failed");
      // }
    } catch (err) {
      console.error(err);
      dispatch(
        add_message({
          message: `Registration failed: ${err}`, // 当注册不成功时，显示异常信息
          status: bannerStatuses.error,
        })
      );
    }
  };

  // if (isAuthenticated) {
  //   return <Navigate to="/profile" replace={true} />;
  // }

  return (
    <div className="signup__form__wrapper">
      <Formik
        initialValues={{ Username: "", password: "", email: "" }}
        onSubmit={handleSubmit}
      >
        <Form className="auth__form">
          <div className="input__box">
            <Field
              className="form__input"
              name="username"
              type="string"
              label="username"
              required="required"
              placeholder="Username"
            />
          </div>

          <div className="input__box">
            <Field
              className="form__input"
              name="password"
              type="password"
              required="required"
              placeholder="Password"
            />
          </div>
          <div className="input__box">
            <Field
              className="form__input"
              name="email"
              type="email"
              required="required"
              placeholder="Email Address"
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
