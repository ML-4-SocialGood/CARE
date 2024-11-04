/** @format */

import { useEffect, useState } from "react";
import "./profile.css";
import { Heading } from "../../components/Heading";
import { Formik, Field, Form } from "formik";
import { Button } from "../../components/Button";
import { useDispatch } from "react-redux";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import Loader from "../../components/Loader";
import apiClient from "../../utils/apiClient";

export default function ProfileUser() {
  const dispatch = useDispatch();

  const [isLoading, setLoading] = useState(true);

  const [user, setUser] = useState({});

  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const metadataResponse = await apiClient("/api/users/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const _user = await metadataResponse.json();
        setUser(_user);
        setLoading(false);
      } catch (e) {
        console.error(e.message);
        dispatch(
          add_message({
            message: `Something went wrong retrieving user information. Please contact a developer for further assistance.`,
            status: bannerStatuses.error,
          })
        );
      }
    };

    getUserMetadata();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const res = await apiClient('/api/users/profile', {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password || undefined,
        }),
      });
      const body = await res.json();

      if (res.status !== 200){
        throw new Error(body.error)
      }

      dispatch(
        add_message({
          message: `${body.message}`,
          status: bannerStatuses.success,
        })
      );
    } catch (err) {
      console.error(err);
      dispatch(
        add_message({
          message: `Update failed: ${err}`, // 当注册不成功时，显示异常信息
          status: bannerStatuses.error,
        })
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="signup">
      <div className="signup__form__container">
        <Heading level={2}>Update profile</Heading>
        <div className="signup__form__wrapper">
          <Formik
            initialValues={{ username: user.username, password: "", email: user.email }}
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
                  disabled
                />
              </div>

              <div className="input__box">
                <Field
                  className="form__input"
                  name="password"
                  type="password"
                  placeholder="Password, not update if empty"
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

              <Button
                className="signup__button"
                variant="primary"
                type="submit"
              >
                Submit
              </Button>
            </Form>
          </Formik>
        </div>
      </div>
    </section>
  );
}
